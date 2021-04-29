const mongoose = require('mongoose');
const positions = require('./positions');

const VoteSchema = new mongoose.Schema({
	voter: {
		type: mongoose.Types.ObjectId,
		required: true,
	},
	candidate: {
		type: mongoose.Types.ObjectId,
		required: true,
	},
	position: {
		type: String,
		required: true,
		enum: positions
	}
});

const Vote = mongoose.model('voting_Vote', VoteSchema);

module.exports = Vote;