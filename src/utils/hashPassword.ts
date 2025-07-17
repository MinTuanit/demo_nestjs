import * as bcrypt from 'bcrypt';
const saltRounds = 10;

export const hashPassword = async (password: string) => {
    try {
        if (!password) {
            throw new Error('Password is required');
        }
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        console.error('Error hashing password:', error);
        throw error;
    }
};
