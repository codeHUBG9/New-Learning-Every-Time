const express = require('express');
const kafka = require('kafka-node');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

const dbAreRunning = async () => {
	mongoose.set('strictQuery', true);
	mongoose
		.connect(process.env.MONGO_URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			autoIndex: true,
			maxPoolSize: 20,
			serverSelectionTimeoutMS: 50000,
			socketTimeoutMS: 95000,
			family: 4,
		})
		.then((con) => {
			console.log(`MongoDB is connected with HOST: ${con.connection.host}`);
		});
	// mongoose.connect(process.env.MONGO_URL);
	const User = new mongoose.model('user', {
		name: String,
		email: String,
		password: String,
	});

	const client = new kafka.KafkaClient({
		kafkaHost: process.env.KAFKA_BOOTSTRAP_SERVIVES,
	});
	const consumer = new kafka.Consumer(
		client,
		[{ topic: process.env.KAFKA_TOPIC }],
		{
			autoCommit: false,
		}
	);
	consumer.on('message', async (message) => {
		const user = await new User.create(JSON.parse(message.value));
		await user.save();
	});
	consumer.on('error', (err) => {
		console.log(err);
	});
};
setTimeout(dbAreRunning, 10000);

app.listen(process.env.PORT);
