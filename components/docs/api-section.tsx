"use client"

import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clipboard, Check, Braces, Code } from "lucide-react"
import { cn } from "@/lib/utils"

const API_DOC_EXAMPLE_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL || "https://kanban.vertexcrm.in"
).replace(/\/$/, "")

export function ApiSection() {
  const [copiedEndpoint, setCopiedEndpoint] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(text)
    setTimeout(() => setCopiedEndpoint(""), 2000)
  }

  const apiResources = [
    {
      name: "Projects",
      description: "Manage projects in the kanban system",
      endpoints: [
        {
          name: "List Projects",
          method: "GET",
          path: "/api/projects",
          description: "Get a list of all projects",
          params: [
            { name: "page", type: "number", description: "Page number for pagination", required: false },
            { name: "limit", type: "number", description: "Results per page (max 100)", required: false },
            { name: "status", type: "string", description: "Filter by status (active, archived, completed)", required: false }
          ],
          response: `{
  "projects": [
    {
      "id": "project-123",
      "name": "Website Redesign",
      "description": "Redesigning the company website with new branding",
      "status": "active",
      "createdAt": "2023-11-15T10:30:00Z",
      "updatedAt": "2023-12-01T14:45:00Z",
      "teamMembers": [
        {
          "id": "user-1",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "manager"
        },
        // ... more team members
      ]
    },
    // ... more projects
  ],
  "totalCount": 15,
  "page": 1,
  "pageCount": 2
}`
        },
        {
          name: "Get Project",
          method: "GET",
          path: "/api/projects/{projectId}",
          description: "Get details for a specific project",
          params: [],
          response: `{
  "id": "project-123",
  "name": "Website Redesign",
  "description": "Redesigning the company website with new branding",
  "status": "active",
  "createdAt": "2023-11-15T10:30:00Z",
  "updatedAt": "2023-12-01T14:45:00Z",
  "teamMembers": [
    {
      "id": "user-1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    },
    // ... more team members
  ],
  "board": {
    "id": "board-123",
    "columns": [
      {
        "id": "column-1",
        "name": "To Do",
        "ticketCount": 5
      },
      // ... more columns
    ]
  }
}`
        },
        {
          name: "Create Project",
          method: "POST",
          path: "/api/projects",
          description: "Create a new project",
          params: [
            { name: "name", type: "string", description: "Project name", required: true },
            { name: "description", type: "string", description: "Project description", required: true },
            { name: "teamMembers", type: "array", description: "Array of user IDs", required: false }
          ],
          response: `{
  "id": "project-123",
  "name": "Website Redesign",
  "description": "Redesigning the company website with new branding",
  "status": "active",
  "createdAt": "2023-12-15T10:30:00Z",
  "updatedAt": "2023-12-15T10:30:00Z",
  "teamMembers": [
    {
      "id": "user-1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    }
  ],
  "board": {
    "id": "board-123",
    "columns": [
      {
        "id": "column-1",
        "name": "To Do",
        "ticketCount": 0
      },
      {
        "id": "column-2",
        "name": "In Progress",
        "ticketCount": 0
      },
      {
        "id": "column-3",
        "name": "Done",
        "ticketCount": 0
      }
    ]
  }
}`
        },
        {
          name: "Update Project",
          method: "PUT",
          path: "/api/projects/{projectId}",
          description: "Update an existing project",
          params: [
            { name: "name", type: "string", description: "Project name", required: false },
            { name: "description", type: "string", description: "Project description", required: false },
            { name: "status", type: "string", description: "Project status", required: false },
            { name: "teamMembers", type: "array", description: "Array of user IDs", required: false }
          ],
          response: `{
  "id": "project-123",
  "name": "Updated Website Redesign",
  "description": "Redesigning the company website with new branding and improved UX",
  "status": "active",
  "createdAt": "2023-11-15T10:30:00Z",
  "updatedAt": "2023-12-15T14:30:00Z",
  "teamMembers": [
    {
      "id": "user-1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager"
    },
    {
      "id": "user-2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "designer"
    }
  ]
}`
        },
        {
          name: "Delete Project",
          method: "DELETE",
          path: "/api/projects/{projectId}",
          description: "Delete a project",
          params: [],
          response: `{
  "success": true,
  "message": "Project successfully deleted"
}`
        }
      ]
    },
    {
      name: "Tickets",
      description: "Manage tickets within projects",
      endpoints: [
        {
          name: "List Tickets",
          method: "GET",
          path: "/api/projects/{projectId}/tickets",
          description: "Get all tickets for a project",
          params: [
            { name: "status", type: "string", description: "Filter by status", required: false },
            { name: "assignee", type: "string", description: "Filter by assignee user ID", required: false },
            { name: "priority", type: "string", description: "Filter by priority", required: false },
            { name: "columnId", type: "string", description: "Filter by kanban column ID", required: false }
          ],
          response: `{
  "tickets": [
    {
      "id": "ticket-456",
      "title": "Implement authentication",
      "description": "Set up JWT authentication flow",
      "status": "in-progress",
      "priority": "high",
      "columnId": "column-2",
      "assignee": {
        "id": "user-1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2023-11-20T09:15:00Z",
      "updatedAt": "2023-12-05T11:30:00Z",
      "dueDate": "2023-12-15T00:00:00Z",
      "commentsCount": 5,
      "attachmentsCount": 2
    },
    // ... more tickets
  ],
  "totalCount": 12
}`
        },
        {
          name: "Get Ticket",
          method: "GET",
          path: "/api/projects/{projectId}/tickets/{ticketId}",
          description: "Get details for a specific ticket",
          params: [],
          response: `{
  "id": "ticket-456",
  "title": "Implement authentication",
  "description": "Set up JWT authentication flow",
  "status": "in-progress",
  "priority": "high",
  "columnId": "column-2",
  "assignee": {
    "id": "user-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "creator": {
    "id": "user-2",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "createdAt": "2023-11-20T09:15:00Z",
  "updatedAt": "2023-12-05T11:30:00Z",
  "dueDate": "2023-12-15T00:00:00Z",
  "comments": [
    {
      "id": "comment-1",
      "text": "I'll be starting this task today",
      "user": {
        "id": "user-1",
        "name": "John Doe"
      },
      "createdAt": "2023-11-20T10:30:00Z"
    },
    // ... more comments
  ],
  "attachments": [
    {
      "id": "attachment-1",
      "fileName": "auth-flow-diagram.pdf",
      "fileUrl": "https://uploadthing.com/f/auth-flow-diagram.pdf",
      "fileSize": 245789,
      "uploadedAt": "2023-11-22T14:20:00Z",
      "uploadedBy": {
        "id": "user-1",
        "name": "John Doe"
      }
    },
    // ... more attachments
  ]
}`
        },
        {
          name: "Create Ticket",
          method: "POST",
          path: "/api/projects/{projectId}/tickets",
          description: "Create a new ticket in a project",
          params: [
            { name: "title", type: "string", description: "Ticket title", required: true },
            { name: "description", type: "string", description: "Ticket description", required: true },
            { name: "priority", type: "string", description: "Ticket priority", required: false },
            { name: "columnId", type: "string", description: "Column ID", required: false },
            { name: "assigneeId", type: "string", description: "User ID of assignee", required: false },
            { name: "dueDate", type: "string", description: "Due date (ISO format)", required: false }
          ],
          response: `{
  "id": "ticket-789",
  "title": "Design login page",
  "description": "Create responsive design for the login page",
  "status": "to-do",
  "priority": "medium",
  "columnId": "column-1",
  "assignee": {
    "id": "user-2",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "creator": {
    "id": "user-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2023-12-15T10:30:00Z",
  "updatedAt": "2023-12-15T10:30:00Z",
  "dueDate": "2023-12-30T00:00:00Z"
}`
        },
        {
          name: "Update Ticket",
          method: "PUT",
          path: "/api/projects/{projectId}/tickets/{ticketId}",
          description: "Update an existing ticket",
          params: [
            { name: "title", type: "string", description: "Ticket title", required: false },
            { name: "description", type: "string", description: "Ticket description", required: false },
            { name: "priority", type: "string", description: "Ticket priority", required: false },
            { name: "columnId", type: "string", description: "Column ID", required: false },
            { name: "assigneeId", type: "string", description: "User ID of assignee", required: false },
            { name: "dueDate", type: "string", description: "Due date (ISO format)", required: false }
          ],
          response: `{
  "id": "ticket-789",
  "title": "Design login and signup pages",
  "description": "Create responsive design for both login and signup pages",
  "status": "in-progress",
  "priority": "high",
  "columnId": "column-2",
  "assignee": {
    "id": "user-2",
    "name": "Jane Smith",
    "email": "jane@example.com"
  },
  "creator": {
    "id": "user-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2023-12-15T10:30:00Z",
  "updatedAt": "2023-12-16T09:45:00Z",
  "dueDate": "2023-12-25T00:00:00Z"
}`
        },
        {
          name: "Delete Ticket",
          method: "DELETE",
          path: "/api/projects/{projectId}/tickets/{ticketId}",
          description: "Delete a ticket",
          params: [],
          response: `{
  "success": true,
  "message": "Ticket successfully deleted"
}`
        }
      ]
    },
    {
      name: "Users",
      description: "Manage users in the system",
      endpoints: [
        {
          name: "List Users",
          method: "GET",
          path: "/api/users",
          description: "Get all users in the system",
          params: [
            { name: "role", type: "string", description: "Filter by role", required: false },
            { name: "status", type: "string", description: "Filter by status", required: false },
            { name: "search", type: "string", description: "Search by name or email", required: false }
          ],
          response: `{
  "users": [
    {
      "id": "user-1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "manager",
      "status": "active",
      "avatar": "https://uploadthing.com/f/avatar-john.jpg",
      "lastActive": "2023-12-15T09:30:00Z",
      "createdAt": "2023-10-01T00:00:00Z"
    },
    // ... more users
  ],
  "totalCount": 24,
  "page": 1,
  "pageCount": 3
}`
        },
        {
          name: "Get User",
          method: "GET",
          path: "/api/users/{userId}",
          description: "Get details for a specific user",
          params: [],
          response: `{
  "id": "user-1",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "manager",
  "status": "active",
  "avatar": "https://uploadthing.com/f/avatar-john.jpg",
  "lastActive": "2023-12-15T09:30:00Z",
  "createdAt": "2023-10-01T00:00:00Z",
  "projects": [
    {
      "id": "project-123",
      "name": "Website Redesign",
      "role": "owner"
    },
    // ... more projects
  ],
  "assignedTickets": [
    {
      "id": "ticket-456",
      "title": "Implement authentication",
      "projectId": "project-123",
      "projectName": "Website Redesign",
      "status": "in-progress",
      "priority": "high"
    },
    // ... more tickets
  ]
}`
        },
        {
          name: "Create User",
          method: "POST",
          path: "/api/users",
          description: "Create a new user",
          params: [
            { name: "name", type: "string", description: "User's full name", required: true },
            { name: "email", type: "string", description: "User's email address", required: true },
            { name: "role", type: "string", description: "User's role", required: true },
            { name: "password", type: "string", description: "User's password", required: true }
          ],
          response: `{
  "id": "user-25",
  "name": "Sarah Johnson",
  "email": "sarah@example.com",
  "role": "engineer",
  "status": "active",
  "avatar": null,
  "lastActive": null,
  "createdAt": "2023-12-15T10:30:00Z"
}`
        },
        {
          name: "Update User",
          method: "PUT",
          path: "/api/users/{userId}",
          description: "Update a user's information",
          params: [
            { name: "name", type: "string", description: "User's full name", required: false },
            { name: "email", type: "string", description: "User's email address", required: false },
            { name: "role", type: "string", description: "User's role", required: false },
            { name: "status", type: "string", description: "User's status", required: false },
            { name: "avatar", type: "string", description: "User's avatar URL", required: false }
          ],
          response: `{
  "id": "user-1",
  "name": "John Doe",
  "email": "john.updated@example.com",
  "role": "admin",
  "status": "active",
  "avatar": "https://uploadthing.com/f/new-avatar-john.jpg",
  "lastActive": "2023-12-15T09:30:00Z",
  "updatedAt": "2023-12-15T10:45:00Z"
}`
        },
        {
          name: "Delete User",
          method: "DELETE",
          path: "/api/users/{userId}",
          description: "Delete a user",
          params: [],
          response: `{
  "success": true,
  "message": "User successfully deleted"
}`
        }
      ]
    },
    {
      name: "Knowledge",
      description: "Manage knowledge articles",
      endpoints: [
        {
          name: "List Articles",
          method: "GET",
          path: "/api/knowledge",
          description: "Get all knowledge articles",
          params: [
            { name: "category", type: "string", description: "Filter by category", required: false },
            { name: "tags", type: "string", description: "Filter by tags (comma separated)", required: false },
            { name: "search", type: "string", description: "Search in title and content", required: false }
          ],
          response: `{
  "articles": [
    {
      "id": "article-1",
      "title": "Getting Started with Kanban",
      "summary": "Introduction to kanban methodology",
      "category": "Methodology",
      "author": {
        "id": "user-1",
        "name": "John Doe"
      },
      "tags": ["kanban", "agile", "beginners"],
      "createdAt": "2023-11-01T10:00:00Z",
      "updatedAt": "2023-11-10T14:30:00Z",
      "views": 245
    },
    // ... more articles
  ],
  "totalCount": 18,
  "page": 1,
  "pageCount": 2
}`
        },
        {
          name: "Get Article",
          method: "GET",
          path: "/api/knowledge/{articleId}",
          description: "Get a specific knowledge article",
          params: [],
          response: `{
  "id": "article-1",
  "title": "Getting Started with Kanban",
  "content": "# Introduction\\n\\nKanban is a workflow management method...",
  "contentHtml": "<h1>Introduction</h1><p>Kanban is a workflow management method...</p>",
  "summary": "Introduction to kanban methodology",
  "category": "Methodology",
  "author": {
    "id": "user-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tags": ["kanban", "agile", "beginners"],
  "createdAt": "2023-11-01T10:00:00Z",
  "updatedAt": "2023-11-10T14:30:00Z",
  "views": 246,
  "attachments": [
    {
      "id": "attachment-1",
      "fileName": "kanban-example.pdf",
      "fileUrl": "https://uploadthing.com/f/kanban-example.pdf",
      "fileSize": 156024
    }
  ],
  "relatedArticles": [
    {
      "id": "article-2",
      "title": "Advanced Kanban Techniques"
    },
    {
      "id": "article-5",
      "title": "Kanban vs Scrum"
    }
  ]
}`
        },
        {
          name: "Create Article",
          method: "POST",
          path: "/api/knowledge",
          description: "Create a new knowledge article",
          params: [
            { name: "title", type: "string", description: "Article title", required: true },
            { name: "content", type: "string", description: "Article content (Markdown)", required: true },
            { name: "summary", type: "string", description: "Short summary", required: true },
            { name: "category", type: "string", description: "Article category", required: true },
            { name: "tags", type: "array", description: "Array of tag strings", required: false },
            { name: "attachments", type: "array", description: "Array of attachment objects", required: false }
          ],
          response: `{
  "id": "article-19",
  "title": "API design guidelines",
  "content": "# API design guidelines\\n\\nThis guide explains...",
  "contentHtml": "<h1>API design guidelines</h1><p>This guide explains...</p>",
  "summary": "REST and versioning conventions for OctaVertex Media services",
  "category": "Engineering",
  "author": {
    "id": "user-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tags": ["api", "engineering", "documentation"],
  "createdAt": "2023-12-15T10:30:00Z",
  "updatedAt": "2023-12-15T10:30:00Z",
  "views": 0,
  "attachments": []
}`
        },
        {
          name: "Update Article",
          method: "PUT",
          path: "/api/knowledge/{articleId}",
          description: "Update an existing knowledge article",
          params: [
            { name: "title", type: "string", description: "Article title", required: false },
            { name: "content", type: "string", description: "Article content (Markdown)", required: false },
            { name: "summary", type: "string", description: "Short summary", required: false },
            { name: "category", type: "string", description: "Article category", required: false },
            { name: "tags", type: "array", description: "Array of tag strings", required: false },
            { name: "attachments", type: "array", description: "Array of attachment objects", required: false }
          ],
          response: `{
  "id": "article-19",
  "title": "API design guidelines — revision history",
  "content": "# API design guidelines — revision history\\n\\nThis updated guide explains...",
  "contentHtml": "<h1>API design guidelines — revision history</h1><p>This updated guide explains...</p>",
  "summary": "How we document breaking changes and deprecations",
  "category": "Engineering",
  "author": {
    "id": "user-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "tags": ["api", "engineering", "documentation", "best-practices"],
  "createdAt": "2023-12-15T10:30:00Z",
  "updatedAt": "2023-12-16T09:15:00Z",
  "views": 5
}`
        },
        {
          name: "Delete Article",
          method: "DELETE",
          path: "/api/knowledge/{articleId}",
          description: "Delete a knowledge article",
          params: [],
          response: `{
  "success": true,
  "message": "Article successfully deleted"
}`
        }
      ]
    },
  ]

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Core APIs</CardTitle>
          <CardDescription>
            RESTful endpoints to manage projects, tickets, users, and knowledge articles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Our API follows REST principles and returns JSON responses. All endpoints are prefixed with
            <code className="bg-muted px-1 py-0.5 rounded">/api</code> and require authentication.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-sm">{API_DOC_EXAMPLE_ORIGIN}</code>
              </CardContent>
            </Card>

            <Card className="bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Rate Limits</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>1,000 requests per hour</p>
                <p>Responses include rate limit headers</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {apiResources.map((resource, index) => (
          <Card key={index} id={resource.name.toLowerCase()}>
            <CardHeader>
              <CardTitle>{resource.name} API</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                {resource.endpoints.map((endpoint, i) => (
                  <AccordionItem key={i} value={`${resource.name}-${i}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3 text-left">
                        <Badge variant="outline" className={cn(
                          "text-xs px-2 py-0",
                          endpoint.method === "GET" ? "bg-blue-100 text-blue-800" :
                            endpoint.method === "POST" ? "bg-green-100 text-green-800" :
                              endpoint.method === "PUT" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                        )}>
                          {endpoint.method}
                        </Badge>
                        <span className="font-medium">{endpoint.name}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted p-2 rounded flex-1 overflow-auto">
                            {endpoint.path}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyToClipboard(endpoint.path)}
                          >
                            {copiedEndpoint === endpoint.path ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Clipboard className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{endpoint.description}</p>
                      </div>

                      {endpoint.params && endpoint.params.length > 0 ? (
                        <div>
                          <h4 className="font-medium mb-2 text-sm">Parameters</h4>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium">Required</th>
                                  <th className="px-4 py-2 text-left text-sm font-medium">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {endpoint.params.map((param, i) => (
                                  <tr key={i}>
                                    <td className="px-4 py-2 text-sm font-mono">{param.name}</td>
                                    <td className="px-4 py-2 text-sm font-mono">{param.type}</td>
                                    <td className="px-4 py-2 text-sm">{param.required ? "Yes" : "No"}</td>
                                    <td className="px-4 py-2 text-sm">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <h4 className="font-medium mb-2 text-sm">Response</h4>
                        <Tabs defaultValue="json" className="w-full">
                          <TabsList className="grid grid-cols-2 w-[200px] mb-2">
                            <TabsTrigger value="json" className="text-xs flex items-center gap-1">
                              <Braces className="h-3 w-3" />
                              <span>Response</span>
                            </TabsTrigger>
                            <TabsTrigger value="code" className="text-xs flex items-center gap-1">
                              <Code className="h-3 w-3" />
                              <span>Example</span>
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="json">
                            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                              <code>{endpoint.response}</code>
                            </pre>
                          </TabsContent>
                          <TabsContent value="code">
                            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
                              <code>{`// Example Request with fetch
const response = await fetch("${API_DOC_EXAMPLE_ORIGIN}${endpoint.path.replace(/{([^}]+)}/g, (_, p1) => `/${p1}Value`)}", {
  method: "${endpoint.method}",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  }${endpoint.method === 'GET' ? '' : `,
  body: JSON.stringify({
    // Request body parameters
  })`}
});

const data = await response.json();
console.log(data);`}</code>
                            </pre>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
