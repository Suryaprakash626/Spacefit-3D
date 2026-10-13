import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import layouts from './routes/layouts.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true }))
app.use(express.json({ limit: '200kb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/layouts', layouts)

app.use((err, _req, res, _next) => {
  if (err.name === 'ValidationError' || err.name === 'CastError')
    return res.status(400).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

await mongoose.connect(process.env.MONGODB_URI)
console.log('MongoDB connected')
const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API on http://localhost:${port}`))