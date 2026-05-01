export interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastActive: string
  avatar: string
}

export interface Comment {
  id?: string
  user: User
  text: string
  createdAt: string
}

export interface Attachment {
  id?: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  type: string
  priority: string
  dueDate: string
  assignee: User
  comments: Comment[]
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
}

export interface KanbanColumn {
  id: string
  title: string
  tickets: Ticket[]
}

export interface Board {
  id: string
  title: string
  columns: KanbanColumn[]
}

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'archived'
  teamMembers: User[]
  createdAt: string
  updatedAt: string
  boardId?: string
}

export interface Meeting {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  organizer: User
  attendees: User[]
  meetLink: string
  createdAt: string
  updatedAt: string
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  /** API returns id, name, avatar; mock data may include full User. */
  author: Pick<User, 'id' | 'name' | 'avatar'>
  createdAt: string
  updatedAt: string
  views: number
}
