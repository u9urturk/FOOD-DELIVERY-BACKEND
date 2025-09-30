import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: DatabaseService) { }

  async create(createRoleDto: CreateRoleDto) {
    const { name, description, permissionIds } = createRoleDto;

    return this.prisma.role.create({
      data: {
        name,
        description,
        rolePermissions: permissionIds
          ? {
            create: permissionIds.map((permissionId) => ({
              permissionId: permissionId,
            })),
          }
          : undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({

    });
  }

  async findOne(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const { name, description, permissionIds } = updateRoleDto;

    // First, remove existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Then update role and add new permissions
    return this.prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        rolePermissions: permissionIds
          ? {
            create: permissionIds.map((permissionId) => ({
              permissionId: permissionId,
            })),
          }
          : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.role.delete({
      where: { id },
    });
  }


  async UpdateRoleToUser(userId: string, oldRoleId: string, newRoleId: string) {
    return this.prisma.userRole.update({
      where: {
        userId_roleId: {
          userId,
          roleId: oldRoleId,
        }
      },
      data: {
        roleId: newRoleId,
      },
    });
  }

  async assignRoleToUser(userId: string, roleId: string) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }
}