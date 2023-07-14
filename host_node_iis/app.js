const express = require('express');
const axios = require('axios');
const cors = require('cors');

var app = express();
const redis = require('redis');

const redisClient = redis.createClient();
const default_Time = 3600;
app.get('/', function (req, res) {
	res.send('Hello Worlxxxxd!');
});
(async () => {
	await redisClient.connect();
})();

app.use(cors());
const URL = 'https://jsonplaceholder.typicode.com/photos';

redisClient.on('connect', function () {
	console.log('redis connected');
});

app.get('/', function (req, res) {
	const data = { data: { default_data: { name: 'rahul' } } };
	res.status(200).json(data);
});

app.get('/photos', async (req, res) => {
	const albumId = req.query.albumId;
	const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
		const { data } = await axios.get(URL, { params: { albumId } });
		return data;
	});

	res.send(photos);

	// await redisClient.get(`photos?albumId=${albumId}`, async (error, photos) => {
	// 	if (error) console.error(error);
	// 	if (photos != null) {
	// 		return res.json(JSON.parse(photos));
	// 	} else {
	// 		const { data } = await axios.get(URL, { params: { albumId } });
	// 		redisClient.setEx('photos', default_Time, JSON.stringify(data));
	// 		res.json(data);
	// 	}
	// });
	// // const photos = await redisClient.get('photos');
	// res.json(JSON.parse(photos));
});

app.get('/data', function (req, res) {
	const data = { data: { name: 'vivek', age: 21, address: 'Delhi' } };
	redisClient.setEx('data', default_Time, JSON.stringify(data));
	res.status(200).json(data);
});

const PORT = process.env.PORT || 8800;
// This is REQUIRED for IISNODE to work
app.listen(PORT, () => {
	console.log('listening');
});

function getOrSetCache(key, callbBack) {
	return new Promise((resolve, reject) => {
		redisClient.get(key, async (error, data) => {
			if (error) return reject(error);
			if (data != null) return JSON.parse(data);
			const freshData = await callbBack();
			redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));
			resolve(freshData);
		});
	});
}
