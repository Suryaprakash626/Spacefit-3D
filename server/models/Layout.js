import mongoose from 'mongoose'

const n = (min, max) => ({ type: Number, required: true, min, max })

const itemSchema = new mongoose.Schema(
  {
    id: n(0, 1e6),
    name: { type: String, required: true, maxlength: 40 },
    w: n(10, 1500),
    d: n(10, 1500),
    clr: n(0, 500),
    ht: n(1, 400),
    h: n(0, 360),
    x: n(-2000, 3000),
    y: n(-2000, 3000),
    rot: { type: Number, enum: [0, 90, 180, 270], required: true },
  },
  { _id: false }
)

const layoutSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    room: {
      W: n(150, 1500),
      L: n(150, 1500),
      wall: { type: String, enum: ['top', 'bottom', 'left', 'right'], required: true },
      off: n(0, 1500),
    },
    items: { type: [itemSchema], validate: (v) => v.length <= 100 },
  },
  { timestamps: true }
)

layoutSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Layout', layoutSchema)