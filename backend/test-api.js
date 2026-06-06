require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const testApi = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const user = await User.findOne({});
    if (!user) {
      console.log('No users found in database');
      return;
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Using user:', user.email);

    const axios = require('axios');
    const response = await axios.post('http://localhost:5000/api/flashcards/generate', {
      text: 'The mitochondria is the powerhouse of the cell. Photosynthesis creates energy for plants.',
      difficulty: 'beginner',
      cardCount: 2
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else {
      console.error('Error:', error);
    }
  } finally {
    mongoose.connection.close();
  }
};

testApi();
