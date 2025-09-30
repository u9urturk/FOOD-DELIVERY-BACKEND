// src/roles/roles.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiProperty } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UpdateRoleDto } from './dto/update-role.dto';

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'admin-role-id', description: 'Yeni atanacak rolün ID değeri' })
  newRoleId!: string;
}

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Roles('ADMIN')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully.' })
  @Roles('ADMIN', 'MANAGER')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @Roles('ADMIN', 'MANAGER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role successfully updated.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @ApiOperation({ summary: 'Assign role to user' })
  @ApiResponse({ status: 201, description: 'Role assigned successfully.' })
  @ApiResponse({ status: 404, description: 'User or role not found.' })
  @Roles('ADMIN')
  @Post(':roleId/users/:userId')
  assignRoleToUser(
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.assignRoleToUser(userId, roleId);
  }

  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: 200, description: 'Role removed successfully.' })
  @ApiResponse({ status: 404, description: 'User or role not found.' })
  @Roles('ADMIN')
  @Delete(':roleId/users/:userId')
  removeRoleFromUser(
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, roleId);
  }

  @ApiOperation({ summary: 'Update user role assignment' })
  @ApiResponse({ status: 200, description: 'User role updated successfully.' })
  @ApiResponse({ status: 404, description: 'User or role not found.' })
  @ApiBody({ type: UpdateUserRoleDto })
  @Roles('ADMIN')
  @Patch(':oldRoleId/users/:userId')
  updateRoleToUser(
    @Param('userId') userId: string,
    @Param('oldRoleId') oldRoleId: string,
    @Body('newRoleId') newRoleId: string,
  ) {
    return this.rolesService.UpdateRoleToUser(userId, oldRoleId, newRoleId);
  }
}