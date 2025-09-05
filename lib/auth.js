// lib/auth.js
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from './prisma'

// 🔑 Genera token JWT
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'supersecret', // meglio definire JWT_SECRET su Vercel
    { expiresIn: '7d' }
  )
}

// 🔑 Verifica token JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'supersecret')
  } catch (err) {
    return null
  }
}

// 🔑 Verifica credenziali login
export async function authenticate(username, password) {
  const user = await prisma.user.findUnique({
    where: { username },
  })
  if (!user) return null

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  return user
}
