require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');

const testApi = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const user = await User.findOne({});
    
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const axios = require('axios');
    const form = new FormData();
    form.append('text', 'The mitochondria is the powerhouse of the cell. Photosynthesis creates energy for plants.');
    form.append('difficulty', 'beginner');
    form.append('cardCount', '2');

    const response = await axios.post('http://localhost:5000/api/flashcards/generate', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status:', response.status);
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
