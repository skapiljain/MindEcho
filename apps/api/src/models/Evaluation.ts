import { Schema, model, type InferSchemaType, type Types } from 'mongoose'

const feedbackSchema = new Schema(
  {
    strengths: { type: [String], default: [] },
    missingConcepts: { type: [String], default: [] },
    improvementTip: { type: String, required: true },
  },
  { _id: false },
)

const subConceptSchema = new Schema(
  {
    name: { type: String, required: true },
    covered: { type: Boolean, required: true },
    score: { type: Number, required: true },
  },
  { _id: false },
)

const retentionImpactSchema = new Schema(
  {
    intervalDays: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false },
)

const evaluationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
    mode: { type: String, enum: ['voice', 'text'], required: true },
    transcript: { type: String },
    selfRating: { type: Number, min: 1, max: 10 },
    lectorScore: { type: Number, required: true },
    correctness: { type: Number, required: true },
    clarity: { type: Number, required: true },
    completeness: { type: Number, required: true },
    feedback: { type: feedbackSchema, required: true },
    subConcepts: { type: [subConceptSchema], default: [] },
    misconceptions: { type: [String], default: [] },
    nextPrompt: { type: String },
    questionId: { type: String },
    retentionImpact: { type: retentionImpactSchema },
    audioUrl: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

evaluationSchema.index({ userId: 1, createdAt: -1 })

export type EvaluationDocument = InferSchemaType<typeof evaluationSchema> & {
  _id: Types.ObjectId
  createdAt: Date
}

export const Evaluation = model('Evaluation', evaluationSchema)
