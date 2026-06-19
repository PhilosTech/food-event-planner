import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth'
import roomsRoutes from './routes/rooms'
import dishesRoutes from './routes/dishes'
import ingredientsRoutes from './routes/ingredients'
import assignmentsRoutes from './routes/assignments'
import attendeesRoutes from './routes/attendees'
import shareRoutes from './routes/share'
import membersRoutes from './routes/members'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomsRoutes)
app.use('/api/rooms', dishesRoutes)
app.use('/api/rooms', ingredientsRoutes)
app.use('/api/rooms', assignmentsRoutes)
app.use('/api/rooms', attendeesRoutes)
app.use('/api/rooms', shareRoutes)
app.use('/api/rooms', membersRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
