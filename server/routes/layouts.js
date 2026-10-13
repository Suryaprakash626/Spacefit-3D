import { Router } from 'express'
import mongoose from 'mongoose'
import Layout from '../models/Layout.js'

const router = Router()

const checkId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid id' })

const pick = ({ name, room, items }) => ({ name, room, items })

router.get('/', async (_req, res) => {
  res.json(await Layout.find().sort({ updatedAt: -1 }).limit(50))
})

router.post('/', async (req, res) => {
  const doc = await Layout.create(pick(req.body))
  res.status(201).json(doc)
})

router.get('/:id', checkId, async (req, res) => {
  const doc = await Layout.findById(req.params.id)
  doc ? res.json(doc) : res.status(404).json({ error: 'Layout not found' })
})

router.put('/:id', checkId, async (req, res) => {
  const doc = await Layout.findByIdAndUpdate(req.params.id, pick(req.body), {
    returnDocument: 'after',
    runValidators: true,
  })
  doc ? res.json(doc) : res.status(404).json({ error: 'Layout not found' })
})

router.delete('/:id', checkId, async (req, res) => {
  const doc = await Layout.findByIdAndDelete(req.params.id)
  doc ? res.status(204).end() : res.status(404).json({ error: 'Layout not found' })
})

export default router