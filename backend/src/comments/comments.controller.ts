import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(
      createCommentDto.content,
      req.user.id,
      createCommentDto.parentId,
    );
  }

  @Get()
  async findAll() {
    return this.commentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.commentsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.update(id, updateCommentDto.content, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.commentsService.delete(id, req.user.id);
  }

  @Post(':id/restore')
  async restore(@Param('id') id: string, @Request() req) {
    return this.commentsService.restore(id, req.user.id);
  }

  @Get('deleted/user')
  async getDeletedComments(@Request() req) {
    return this.commentsService.getDeletedComments(req.user.id);
  }

  @Get('debug/all')
  async debugAllComments() {
    return this.commentsService.debugAllComments();
  }
} 