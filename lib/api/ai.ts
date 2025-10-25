import { apiClient } from "./config"

export const aiApi = {
  chat: async (message: string, conversationId?: string) => {
    return apiClient.post("/ai/chat", { message, conversation_id: conversationId })
  },

  summarizeDocument: async (documentId: string) => {
    return apiClient.post("/ai/summarize-document", { document_id: documentId })
  },

  summarizeDiscussion: async (projectId: string) => {
    return apiClient.post("/ai/summarize-discussion", { project_id: projectId })
  },

  getInsights: async (projectId?: string) => {
    return apiClient.get("/ai/insights", { params: { project_id: projectId } })
  },

  getSummaries: async () => {
    return apiClient.get("/ai/summaries")
  },
}
