"use public";

import { Injectable } from "@kithinji/orca";
import { User } from "./entities/user.entity";
import { InjectRepository } from "@kithinji/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async updateUser(userId: string, data: Partial<User>) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    Object.assign(user, data);

    return await this.userRepo.save(user);
  }
}
