import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { hashPassword } from '@/utils/hashPassword';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name)
  private userModel: Model<User>) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password, phone, address, image } = createUserDto;
      const hashedPassword = await hashPassword(password);
      const existingUser = await this.userModel.findOne({ email: email });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
      const newUser = await this.userModel.create({ name, email, password: hashedPassword, phone, address, image });
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async findAll(query: string, current: number) {
    const { filter, limit, sort } = aqp(query);
    if (filter.current) delete filter.current;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (current - 1) * limit;
    const result = await this.userModel
      .find(filter)
      .limit(limit)
      .skip(skip)
      .select('-password')
      .sort(sort as any);
    return {
      result,
      totalPages
    };
  }

  async findOne(id: string) {
    return await this.userModel.findById(id).select('-password');
  }

  async findUserByEmail(email: string) {
    return await this.userModel.findOne({ email });
  }


  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const { password, ...rest } = updateUserDto as any;

      // Nếu có password → hash lại
      if (password) {
        rest.password = await hashPassword(password);
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, rest, { new: true })
        .select('-password');

      if (!updatedUser) {
        throw new NotFoundException('User not found');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id).select('-password');
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return {
      message: 'User deleted successfully',
      id: deletedUser.id,
      name: deletedUser.name,
      email: deletedUser.email,
    };
  }

}
