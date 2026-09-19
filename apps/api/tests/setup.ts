import { afterAll, afterEach, beforeAll } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

// Force deterministic mocks before app modules load env from .env
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-min-8-chars-long'
process.env.LLM_PROVIDER = 'mock'
process.env.STT_PROVIDER = 'mock'
process.env.PAYMENT_PROVIDER = 'mock'
process.env.NOTIFICATION_PROVIDER = 'mock'
process.env.AUDIO_STORAGE = 'local'
process.env.EMBEDDING_PROVIDER = 'mock'
process.env.EMBEDDING_ENABLED = 'true'
process.env.FEATURE_BILLING = 'true'
process.env.FEATURE_VOICE_EVAL = 'true'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongod.getUri()

  await mongoose.connect(process.env.MONGODB_URI)
}, 60_000)

afterEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({})
  }
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongod) {
    await mongod.stop()
  }
})
