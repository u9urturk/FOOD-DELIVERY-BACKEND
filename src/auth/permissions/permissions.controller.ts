import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdatePermissionDto } from './dto/update-permission.dto';


@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ 
    status: 201, 
    description: 'Permission successfully created.',
    type: CreatePermissionDto
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden. Requires ADMIN role.' 
  })
  @Roles('ADMIN')
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all permissions.',
    type: [CreatePermissionDto]
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden. Requires ADMIN or MANAGER role.' 
  })
  @Roles('ADMIN', 'MANAGER')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission details.',
    type: CreatePermissionDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Permission not found.' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden. Requires ADMIN or MANAGER role.' 
  })
  @Roles('ADMIN', 'MANAGER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission successfully updated.',
    type: UpdatePermissionDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Permission not found.' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden. Requires ADMIN role.' 
  })
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @ApiOperation({ summary: 'Delete permission' })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission successfully deleted.' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Permission not found.' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden. Requires ADMIN role.' 
  })
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}