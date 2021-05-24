const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
	uuid: {
		type: String,
		required: true
	},
	votesConfirmed: {
		type: Boolean,
		default: false
	},
	hashDigest: {
		type: String,
		required: true
	},
	emailConfirmed: {
		type: Boolean,
		default: false
	}
});

const Voter = mongoose.model('voting_Voter', VoterSchema);

module.exports = Voter;