// server.js
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const gTTS = require('gtts');
const tempFolder = '/tmp'; // Render allows using /tmp for temp storage

const videoPath = `${tempFolder}/${id}.mp4`;
const outputPath = `${tempFolder}/${id}_final.mp4`;
const audioPath = `${tempFolder}/${id}.mp3`;


const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

// Generate route
app.post('/generate', async (req, res) => {
  const { youtubeUrl } = req.body;
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  const id = uuidv4();
  const videoPath = `./videos/${id}.mp4`;
  const outputPath = `./outputs/${id}_final.mp4`;
  const audioPath = `./audios/${id}.mp3`;

  try {
    // 1. Download YouTube video
    await downloadYoutubeVideo(youtubeUrl, videoPath);

    // 2. Cut a random 30-sec clip
    await cutVideo(videoPath, outputPath);

    // 3. Generate voiceover
    await generateVoiceover(audioPath);

    // 4. Merge voiceover with video
    await mergeAudioVideo(outputPath, audioPath);

    // 5. Return link
    res.json({ downloadLink: `/outputs/${id}_final.mp4` });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Serve static files
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Helper Functions
function downloadYoutubeVideo(url, outputPath) {
  return new Promise((resolve, reject) => {
    exec(`yt-dlp -f 'best[ext=mp4]' -o "${outputPath}" "${url}"`, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
}

function cutVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const startTime = Math.floor(Math.random() * 60); // pick random start (within first min)
    exec(`ffmpeg -ss ${startTime} -i "${inputPath}" -t 30 -c copy "${outputPath}"`, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
}

function generateVoiceover(audioPath) {
  return new Promise((resolve, reject) => {
    const text = "This is your AI-generated short video created by MakeitReel!";
    const gtts = new gTTS(text, 'en');
    gtts.save(audioPath, function (err, result){
      if(err) {
        return reject(err);
      }
      resolve(result);
    });
  });
}

function mergeAudioVideo(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    const tempPath = videoPath.replace('_final', '_with_audio');
    exec(`ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -strict experimental "${tempPath}" -y`, (error, stdout, stderr) => {
      if (error) {
        return reject(stderr);
      }
      // Replace old video with new one
      fs.renameSync(tempPath, videoPath);
      resolve(stdout);
    });
  });
}
