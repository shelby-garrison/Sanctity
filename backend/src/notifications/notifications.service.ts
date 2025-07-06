import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    message: string,
    relatedCommentId?: string,
  ): Promise<Notification> {
    console.log('Creating notification:', { userId, type, message, relatedCommentId });
    
    const notification = this.notificationsRepository.create({
      user: { id: userId },
      type,
      message,
      relatedCommentId,
    });

    const savedNotification = await this.notificationsRepository.save(notification);
    console.log('Notification created successfully:', savedNotification.id);
    
    return savedNotification;
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user: { id: userId }, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (notification) {
      notification.markAsRead();
      return this.notificationsRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
  }

  async markAsUnread(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (notification) {
      notification.markAsUnread();
      return this.notificationsRepository.save(notification);
    }

    return notification;
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.notificationsRepository.delete({ id, user: { id: userId } });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
  }
} 