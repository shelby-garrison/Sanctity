import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async create(content: string, userId: string, parentId?: string): Promise<Comment> {
    const comment = this.commentsRepository.create({
      content,
      user: { id: userId },
      parent: parentId ? { id: parentId } : null,
    });

    const savedComment = await this.commentsRepository.save(comment);

    // If this is a reply, notify the parent comment's author
    if (parentId) {
      const parentComment = await this.findById(parentId);
      if (parentComment && parentComment.user.id !== userId) {
        // Get the current user's info for the notification message
        const currentUser = await this.usersService.findById(userId);
        const username = currentUser?.username || 'Someone';
        
        await this.notificationsService.create(
          parentComment.user.id,
          NotificationType.REPLY,
          `${username} replied to your comment`,
          savedComment.id,
        );
      }
    }

    return this.findById(savedComment.id);
  }

  async findAll(): Promise<Comment[]> {
    // Get only top-level comments (no parent) - using parent_id IS NULL
    const topLevelComments = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.parent_id IS NULL')
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('comment.createdAt', 'DESC')
      .getMany();



    // For each top-level comment, load its replies recursively
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await this.loadRepliesRecursively(comment.id);
        comment.replies = replies;
        return comment;
      })
    );

    return commentsWithReplies;
  }

  private async loadRepliesRecursively(parentId: string): Promise<Comment[]> {
    const replies = await this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.parent_id = :parentId', { parentId })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('comment.createdAt', 'ASC')
      .getMany();

    // Recursively load nested replies for each reply
    const repliesWithNestedReplies = await Promise.all(
      replies.map(async (reply) => {
        const nestedReplies = await this.loadRepliesRecursively(reply.id);
        reply.replies = nestedReplies;
        return reply;
      })
    );

    return repliesWithNestedReplies;
  }

  async findById(id: string): Promise<Comment | null> {
    return this.commentsRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['user', 'replies', 'replies.user', 'parent', 'parent.user'],
    });
  }

  async update(id: string, content: string, userId: string): Promise<Comment> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    if (!comment.canEdit()) {
      throw new ForbiddenException('Comments can only be edited within 15 minutes of posting');
    }

    comment.content = content;
    comment.markAsEdited();

    return this.commentsRepository.save(comment);
  }

  async delete(id: string, userId: string): Promise<void> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.softDelete();
    await this.commentsRepository.save(comment);
  }

  async restore(id: string, userId: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id, user: { id: userId }, isDeleted: true },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (!comment.canRestore()) {
      throw new ForbiddenException('Comments can only be restored within 15 minutes of deletion');
    }

    comment.restore();
    return this.commentsRepository.save(comment);
  }

  async getDeletedComments(userId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { user: { id: userId }, isDeleted: true },
      relations: ['user'],
      order: { deletedAt: 'DESC' },
    });
  }

  // Debug method to check all comments
  async debugAllComments(): Promise<any[]> {
    const allComments = await this.commentsRepository.find({
      relations: ['user', 'parent'],
      order: { createdAt: 'ASC' },
    });

    return allComments.map(comment => ({
      id: comment.id,
      content: comment.content.substring(0, 50) + '...',
      parentId: comment.parent?.id || null,
      isTopLevel: comment.parent === null,
      user: comment.user?.username,
      createdAt: comment.createdAt,
    }));
  }
} 