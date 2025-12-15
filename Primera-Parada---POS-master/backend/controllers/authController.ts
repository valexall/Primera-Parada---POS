import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_cambiar_en_prod';

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Buscar usuario
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 2. Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar Token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name }, 
      JWT_SECRET, 
      { expiresIn: '8h' } // Turno laboral completo
    );

    res.json({ token, user: { name: user.name, role: user.role, email: user.email } });

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

// Registrar Usuario (Solo para uso inicial o admin)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Hash del password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password: hashedPassword, name, role }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Usuario creado', userId: data.id });
  } catch (error) {
    res.status(500).json({ error: 'Error creando usuario' });
  }
};