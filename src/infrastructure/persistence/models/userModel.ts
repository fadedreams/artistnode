// src/infrastructure/persistence/models/userModel.ts
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser } from '@src/domain/entities/user';

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        trim: true,
        required: false,
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: true,
    },
    role: {
        type: String,
        required: true,
        default: 'user',
        enum: ['admin', 'user'],
    },
});

userSchema.pre<IUser>('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function(password: string) {
    return bcrypt.compare(password, this.password);
};

const UserModel = mongoose.model<IUser>('User', userSchema);

export default UserModel;

