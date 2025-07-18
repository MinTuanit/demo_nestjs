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

export const comparePassWord = async (password: string, hashpassword: string) => {
    try {
        if (!password) {
            throw new Error('Password is required');
        }
        if (!hashpassword) {
            throw new Error('Hash password is required');
        }
        return await bcrypt.compare(password, hashpassword);
    } catch (error) {
        console.error('Error comparing password:', error);
        throw error;
    }
};
