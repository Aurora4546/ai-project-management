const https = require('https');
const fs = require('fs');

const url = 'https://lh3.googleusercontent.com/aida/ADBb0uhgyXFatDjUGT4AcguBnxNiPzFvpj9QvvqWlVvuUp3H4AAhJvTEs1asJTHBeUDMfJu1z-QjgTjiMF14TFFsRKu7SnM_SuHvAcWdQG3GAqMICgiwX2okO82U-7M5uIYTuMCxrO0DPqL174iPdVPy3jZYuMsNR2qLbGRgCcciMFkBqxyYOmULrFusKSSeE8-isLlKe9oWgIK5AjLNdqqItZtsmott97lqrD3B6fSKo_a6ymavMgRGa9O8Teo3';
const outputPath = './create-issue.png';

https.get(url, (response) => {
    if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(outputPath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log('Download complete.');
        });
    } else {
        console.error(`Failed to download image. Status code: ${response.statusCode}`);
    }
}).on('error', (err) => {
    console.error(`Error downloading image: ${err.message}`);
});
