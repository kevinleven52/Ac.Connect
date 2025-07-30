import User from '../model/user.model.js';
import redis from '../lib/redis.js';
import jwt from 'jsonwebtoken';


const generateToken = (userId) => {
  // Function to generate a token for the user
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
  
}

const storeRefreshToken = async (userId, refreshToken) => {
  // Function to store the refresh token in Redis or any other storage
  await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60); // Store for 7 days
}


const setCookie = (res, accessToken, refreshToken) => {
  res.cookie('access_token', accessToken, {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Helps prevent CSRF attacks
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExits = await User.findOne({ email });
    if (userExits) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ name, email, password });

    // Generate authentication tokens
    const { accessToken, refreshToken } = generateToken(user._id);

    // Store refresh token
    await storeRefreshToken(user._id, refreshToken);

    // Set cookies
    setCookie(res, accessToken, refreshToken);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.log('Error in signup controller:', error.message);
    res.status(500).json({ message: error.message });
  }
};
  

export const login = async (req, res) => {
  try{

    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if(user && await user.comparePassword(password)){
      // Generate authentication tokens
      const { accessToken, refreshToken } = generateToken(user._id);

      // Store refresh token
      await storeRefreshToken(user._id, refreshToken);

      // Set cookies
      setCookie(res, accessToken, refreshToken);

      res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        message: 'Login successful',
      });
  }
  else{
    return res.status(401).json({ message: 'Invalid email or password' });
  }
}catch (error) {
  console.log('Error in login controller:', error.message);
    res.status(500).json({ message: error.message });
  }
}

export const logout = async (req, res) => {
  try{
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      const userId = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET).userId;
      await redis.del(`refresh_token:${userId}`); // Delete the refresh token from Redis
    }

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logged out successfully' });

  }catch (error) {
    console.log('Error in logout controller:', error.message);
    return res.status(500).json({ message:"Server error", error: error.message });
  }
}

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const userId = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET).userId;
    const storedRefreshToken = await redis.get(`refresh_token:${userId}`);

    if (refreshToken !== storedRefreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' }); 

   res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      accessToken,
      message: 'Access token refreshed successfully',
    });   
    
  } catch (error) {
    console.log('Error in refresh token controller:', error.message);
    return res.status(500).json({ message: error.message });
  }
};



// Todo: Implement getProfile function
export const getProfile = async (req, res) => {
  try {
    res.json(res.user)
  }catch(error) {
    console.log('Error in getProfile controller:', error.message);
    res.status(500).json({ message: error.message });
  }
    
}

