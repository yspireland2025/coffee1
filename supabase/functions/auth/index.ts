import { createClient } from 'npm:@supabase/supabase-js@2'
import { hash, compare } from 'npm:bcryptjs'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.0/mod.ts'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

Deno.serve(async (req) => {
  console.log('Auth function called with method:', req.method);
  console.log('Auth function called with URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      })
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const action = pathParts[pathParts.length - 1]

    console.log('URL pathname:', url.pathname);
    console.log('Path parts:', pathParts);
    console.log('Extracted action:', action);

    switch (action) {
      case 'login':
        return await handleLogin(req, supabaseClient)
      case 'register':
        return await handleRegister(req, supabaseClient)
      case 'change-password':
        return await handleChangePassword(req, supabaseClient)
      default:
        console.log('Invalid action received:', action);
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}. Available actions: login, register, change-password` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Auth function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleLogin(req: Request, supabaseClient: any) {
  try {
    console.log('Handling login request')
    const { email, password }: LoginRequest = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Looking up user:', email)

    // Get user from database
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (userError) {
      console.error('User lookup error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user) {
      console.log('User not found')
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user.is_active) {
      console.log('User account is deactivated')
      return new Response(
        JSON.stringify({ error: 'Account is deactivated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Verifying password')

    // Compare password
    const isValidPassword = await compare(password, user.password)

    if (!isValidPassword) {
      console.log('Invalid password')
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Login successful, updating last login')

    // Update last login
    await supabaseClient
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Generate session token (simple JWT-like token)
    const sessionToken = await generateSessionToken(user)

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    console.log('Returning successful login response')

    return new Response(
      JSON.stringify({
        user: userWithoutPassword,
        session: {
          access_token: sessionToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: 'Login failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleRegister(req: Request, supabaseClient: any) {
  try {
    console.log('Handling register request')
    const { email, password, full_name }: RegisterRequest = await req.json()

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const { data: newUser, error: createError } = await supabaseClient
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        full_name,
        role: 'user',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('User creation error:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate session token
    const sessionToken = await generateSessionToken(newUser)

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = newUser

    return new Response(
      JSON.stringify({
        user: userWithoutPassword,
        session: {
          access_token: sessionToken,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return new Response(
      JSON.stringify({ error: 'Registration failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleChangePassword(req: Request, supabaseClient: any) {
  try {
    const { userId, currentPassword, newPassword }: ChangePasswordRequest = await req.json()

    if (!userId || !currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'User ID, current password, and new password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'New password must be at least 8 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify current password
    const isValidPassword = await compare(currentPassword, user.password)

    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Current password is incorrect' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash new password
    const hashedNewPassword = await hash(newPassword, 12)

    // Update password
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        password: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Password updated successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Change password error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to change password' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function generateSessionToken(user: any): Promise<string> {
  try {
    // Use Supabase's JWT secret for token generation
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET') || Deno.env.get('JWT_SECRET') || 'your-secret-key-change-in-production'
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      user_metadata: {
        full_name: user.full_name
      },
      app_metadata: {
        role: user.role
      },
      iat: getNumericDate(new Date()),
      exp: getNumericDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
    }
    
    return await create({ alg: 'HS256', typ: 'JWT' }, payload, key)
  } catch (error) {
    console.error('JWT generation error:', error)
    throw new Error('Failed to generate session token')
  }
}