import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @Column({ name: 'is_edited', default: false })
  isEdited: boolean;

  @Column({ name: 'edited_at', nullable: true })
  editedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Comment, comment => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment;

  @OneToMany(() => Comment, comment => comment.parent)
  replies: Comment[];

  // Helper methods
  canEdit(): boolean {
    const now = new Date();
    const editDeadline = new Date(this.createdAt.getTime() + 15 * 60 * 1000); // 15 minutes
    return now <= editDeadline;
  }

  canRestore(): boolean {
    if (!this.isDeleted || !this.deletedAt) return false;
    const now = new Date();
    const restoreDeadline = new Date(this.deletedAt.getTime() + 15 * 60 * 1000); // 15 minutes
    return now <= restoreDeadline;
  }

  markAsEdited() {
    this.isEdited = true;
    this.editedAt = new Date();
  }

  softDelete() {
    this.isDeleted = true;
    this.deletedAt = new Date();
  }

  restore() {
    this.isDeleted = false;
    this.deletedAt = null;
  }
} 