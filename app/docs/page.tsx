"use client"

import { useState } from "react"
import { PageShell } from "@/components/layout/page-shell"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clipboard, Check, Code, Database, Mail, Video, FileUp, Globe } from "lucide-react"
import { ApiSection } from "@/components/docs/api-section"
import { IntegrationSection } from "@/components/docs/integration-section"
import { SchemaSection } from "@/components/docs/schema-section"
import { AuthSection } from "@/components/docs/auth-section"

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState("core")
  const [copiedEndpoint, setCopiedEndpoint] = useState("")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEndpoint(text)
    setTimeout(() => setCopiedEndpoint(""), 2000)
  }

  return (
    <PageShell noPadding>
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-12 px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Cengineers Kanban API</h1>
          <p className="text-lg opacity-90">
            Complete API reference for integrating with our legal project management platform
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 pt-6 max-w-7xl mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <div className="sticky top-16 z-10 bg-background pt-2 pb-4 border-b">
            <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 gap-1 w-full max-w-4xl">
              <TabsTrigger value="core" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>Core APIs</span>
              </TabsTrigger>
              <TabsTrigger value="auth" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Authentication</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Database</span>
              </TabsTrigger>
              <TabsTrigger value="mail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </TabsTrigger>
              <TabsTrigger value="meet" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Google Meet</span>
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                <span>Storage</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="core">
            <div className="space-y-8">
              <ApiSection />
            </div>
          </TabsContent>

          <TabsContent value="auth">
            <AuthSection />
          </TabsContent>

          <TabsContent value="database">
            <SchemaSection />
          </TabsContent>

          <TabsContent value="mail">
            <IntegrationSection
              title="Email API"
              description="Send emails through Resend integration"
              icon={<Mail className="h-6 w-6" />}
              endpoints={[
                {
                  name: "Send Email",
                  method: "POST",
                  path: "/api/mail/send",
                  description: "Send an email using Resend",
                  requestFormat: {
                    to: "string | string[]",
                    subject: "string",
                    html: "string",
                    text: "string (optional)",
                    cc: "string | string[] (optional)",
                    bcc: "string | string[] (optional)",
                    from: "string (optional)",
                    attachments: "Attachment[] (optional)"
                  },
                  responseFormat: {
                    id: "string",
                    success: "boolean"
                  },
                  example: `const response = await fetch("/api/mail/send", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "recipient@example.com",
    subject: "New Ticket Assigned",
    html: "<h1>You've been assigned a new ticket</h1><p>Please review it at your earliest convenience.</p>"
  })
});

const data = await response.json();
// { id: "email_123456", success: true }`
                },
                {
                  name: "Send Template Email",
                  method: "POST",
                  path: "/api/mail/template",
                  description: "Send an email using a predefined template",
                  requestFormat: {
                    templateId: "string",
                    to: "string | string[]",
                    subject: "string",
                    data: "object",
                    cc: "string | string[] (optional)",
                    bcc: "string | string[] (optional)"
                  },
                  responseFormat: {
                    id: "string",
                    success: "boolean"
                  },
                  example: `const response = await fetch("/api/mail/template", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    templateId: "ticket-assigned",
    to: "recipient@example.com",
    subject: "New Ticket Assigned",
    data: { 
      ticketId: "ticket-123", 
      ticketTitle: "Implement Authentication",
      assignedBy: "John Doe"
    }
  })
});

const data = await response.json();
// { id: "email_123456", success: true }`
                }
              ]}
            />
          </TabsContent>

          <TabsContent value="meet">
            <IntegrationSection
              title="Google Meet API"
              description="Schedule and manage video meetings"
              icon={<Video className="h-6 w-6" />}
              endpoints={[
                {
                  name: "Create Meeting",
                  method: "POST",
                  path: "/api/meetings/create",
                  description: "Create a new Google Meet meeting",
                  requestFormat: {
                    title: "string",
                    startTime: "ISO8601 date string",
                    endTime: "ISO8601 date string",
                    description: "string (optional)",
                    attendees: "string[] (email addresses, optional)"
                  },
                  responseFormat: {
                    id: "string",
                    meetingUrl: "string",
                    joinUrl: "string",
                    startTime: "string",
                    endTime: "string"
                  },
                  example: `const response = await fetch("/api/meetings/create", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer \${apiToken}" },
  body: JSON.stringify({
    title: "Project Kickoff Meeting",
    startTime: "2023-12-20T10:00:00Z",
    endTime: "2023-12-20T11:00:00Z",
    description: "Initial planning meeting for the contract review system",
    attendees: ["john@example.com", "jane@example.com"]
  })
});

const data = await response.json();
// {
//   id: "meet_abcdef123456",
//   meetingUrl: "https://meet.google.com/abc-defg-hij",
//   joinUrl: "https://meet.google.com/abc-defg-hij?authuser=0",
//   startTime: "2023-12-20T10:00:00Z",
//   endTime: "2023-12-20T11:00:00Z"
// }`
                },
                {
                  name: "Update Meeting",
                  method: "PUT",
                  path: "/api/meetings/{meetingId}",
                  description: "Update an existing Google Meet meeting",
                  requestFormat: {
                    title: "string (optional)",
                    startTime: "ISO8601 date string (optional)",
                    endTime: "ISO8601 date string (optional)",
                    description: "string (optional)",
                    attendees: "string[] (email addresses, optional)"
                  },
                  responseFormat: {
                    id: "string",
                    meetingUrl: "string",
                    joinUrl: "string",
                    updated: "boolean",
                    startTime: "string",
                    endTime: "string"
                  },
                  example: `const response = await fetch("/api/meetings/meet_abcdef123456", {
  method: "PUT",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer \${apiToken}" },
  body: JSON.stringify({
    title: "Updated Project Kickoff Meeting",
    startTime: "2023-12-21T10:00:00Z",
    endTime: "2023-12-21T11:30:00Z"
  })
});

const data = await response.json();
// {
//   id: "meet_abcdef123456",
//   meetingUrl: "https://meet.google.com/abc-defg-hij",
//   joinUrl: "https://meet.google.com/abc-defg-hij?authuser=0",
//   updated: true,
//   startTime: "2023-12-21T10:00:00Z",
//   endTime: "2023-12-21T11:30:00Z"
// }`
                },
                {
                  name: "Delete Meeting",
                  method: "DELETE",
                  path: "/api/meetings/{meetingId}",
                  description: "Cancel and delete a Google Meet meeting",
                  requestFormat: {},
                  responseFormat: {
                    success: "boolean",
                    message: "string"
                  },
                  example: `const response = await fetch("/api/meetings/meet_abcdef123456", {
  method: "DELETE",
  headers: { "Authorization": "Bearer \${apiToken}" }
});

const data = await response.json();
// { success: true, message: "Meeting successfully cancelled" }`
                }
              ]}
            />
          </TabsContent>

          <TabsContent value="storage">
            <IntegrationSection
              title="File Storage API"
              description="Store and manage files using UploadThing"
              icon={<FileUp className="h-6 w-6" />}
              endpoints={[
                {
                  name: "Upload File",
                  method: "POST",
                  path: "/api/uploadthing",
                  description: "Upload a file using UploadThing",
                  requestFormat: {
                    file: "File",
                    fileKey: "string (optional)",
                    metadata: "object (optional)"
                  },
                  responseFormat: {
                    fileUrl: "string",
                    fileKey: "string",
                    fileName: "string",
                    fileSize: "number",
                    metadata: "object"
                  },
                  example: `// Using form data
const formData = new FormData();
formData.append("file", file);
formData.append("metadata", JSON.stringify({ 
  projectId: "project-123",
  ticketId: "ticket-456" 
}));

const response = await fetch("/api/uploadthing", {
  method: "POST",
  body: formData
});

const data = await response.json();
// {
//   fileUrl: "https://uploadthing.com/f/abc123-file.pdf",
//   fileKey: "abc123-file.pdf",
//   fileName: "contract_draft.pdf",
//   fileSize: 2458932,
//   metadata: { projectId: "project-123", ticketId: "ticket-456" }
// }`
                },
                {
                  name: "Get File",
                  method: "GET",
                  path: "/api/files/{fileKey}",
                  description: "Get file information by key",
                  requestFormat: {},
                  responseFormat: {
                    fileUrl: "string",
                    fileKey: "string",
                    fileName: "string",
                    fileSize: "number",
                    uploadedAt: "string",
                    metadata: "object"
                  },
                  example: `const response = await fetch("/api/files/abc123-file.pdf", {
  headers: { "Authorization": "Bearer \${apiToken}" }
});

const data = await response.json();
// {
//   fileUrl: "https://uploadthing.com/f/abc123-file.pdf",
//   fileKey: "abc123-file.pdf",
//   fileName: "contract_draft.pdf", 
//   fileSize: 2458932,
//   uploadedAt: "2023-12-15T10:30:00Z",
//   metadata: { projectId: "project-123", ticketId: "ticket-456" }
// }`
                },
                {
                  name: "Delete File",
                  method: "DELETE",
                  path: "/api/files/{fileKey}",
                  description: "Delete a file by key",
                  requestFormat: {},
                  responseFormat: {
                    success: "boolean",
                    message: "string"
                  },
                  example: `const response = await fetch("/api/files/abc123-file.pdf", {
  method: "DELETE",
  headers: { "Authorization": "Bearer \${apiToken}" }
});

const data = await response.json();
// { success: true, message: "File successfully deleted" }`
                }
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  )
}
