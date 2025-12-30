import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from './config/db.js'
import path from 'path'
import invoiceRouter from './routes/invoiceRouter.js'
import businessProfileRouter from './routes/businessProfileRouter.js'
import aiInvoiceRouter from './routes/aiinvoiceRouter.js'

const app = express()
const port = 4000

/* ===================== CORS FIX ===================== */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
/* =================================================== */

app.use(clerkMiddleware())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))

connectDB()

app.use('/uploads', express.static(path.join(process.cwd(), "uploads")))

app.use('/api/invoice', invoiceRouter)
app.use('/api/businessProfile', businessProfileRouter)
app.use('/api/ai', aiInvoiceRouter)

app.get('/', (req, res) => {
  res.send("API working")
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
