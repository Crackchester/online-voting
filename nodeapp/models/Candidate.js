const mongoose = require('mongoose');
const positions = require('./positions');
const validate = require('mongoose-validator');

const emailValidator = validate({
	validator: 'isEmail',
});

const CandidateSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		validate: emailValidator
	},
	positions: {
		type: [String],
		enum: positions,
		required: true
	},
	manifesto: {
		type: String,
		required: true
	}
});

const Candidate = mongoose.model('voting_Candidate', CandidateSchema);

module.exports = Candidate;