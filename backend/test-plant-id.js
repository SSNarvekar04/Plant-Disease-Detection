/**
 * Quick manual probe for a Plant.id key — not part of the test suites.
 *
 *   node test-plant-id.js "C:\path\leaf.jpg"
 *
 * Costs one or two credits, so it is never called automatically.
 * The automated equivalent is `npm run test:integration`.
 */

require('dotenv').config();

const axios = require('axios');
const fs = require('fs');

async function testPlantId() {
  try {
    const imagePath = process.argv[2];

    if (!imagePath) {
      console.log('Please provide an image path.');
      console.log('Example: node test-plant-id.js "C:\\path\\leaf.jpg"');
      return;
    }

    const imageBase64 = fs.readFileSync(imagePath).toString('base64');

    const response = await axios.post(
      'https://api.plant.id/v3/identification',
      {
        images: [imageBase64],
        health: 'all',
        classification_level: 'species',
      },
      {
        headers: {
          'Api-Key': process.env.PLANT_ID_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(
      'Plant.id API Error:',
      error.response?.data || error.message
    );
  }
}

testPlantId();