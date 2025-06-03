import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import io, { Socket } from "socket.io-client";

interface CourseMessage {
  id: number;
  text: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface CourseChatProps {
  courseId: number;
  userEnrollmentStatus?: string;
}

const CourseChat: React.FC<CourseChatProps> = ({
  courseId,
  userEnrollmentStatus,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<CourseMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getTokenFromStorage = (): string | null => {
    return localStorage.getItem("access_token");
  };

  // Check if user can access chat (instructors always can, students only if active enrollment)
  const canAccessChat =
    user?.role === "INSTRUCTOR" || userEnrollmentStatus === "ACTIVE";

  useEffect(() => {
    if (!canAccessChat) {
      setLoading(false);
      return;
    }

    const token = getTokenFromStorage();
    if (!token) {
      console.error("No token found for chat connection");
      return;
    }

    // Initialize socket connection
    const socketInstance = io(`http://localhost:3000`, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    setSocket(socketInstance);

    // Join course room
    socketInstance.emit("joinCourse", courseId);

    // Listen for events
    socketInstance.on("joinCourseSuccess", () => {
      console.log("Connected to chat server");
      socketInstance.emit("join-course", courseId);
    });

    socketInstance.on("joinCourseSuccess", (data) => {
      console.log("Joined course room:", data);
      setLoading(false);
    });

    socketInstance.on("joinCourseError", (error) => {
      console.error("Failed to join course room:", error);
      toast({
        title: "Error",
        description: "Failed to connect to course chat",
        variant: "destructive",
      });
      setLoading(false);
    });

    socketInstance.on("courseMessage", (message: CourseMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socketInstance.on("sendCourseMessageError", (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [courseId, toast, canAccessChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !socket || !user) return;

    socket.emit("sendCourseMessage", {
      courseId,
      userId: user.id,
      username: user.username,
      text: newMessage.trim(),
    });

    setNewMessage("");
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (!canAccessChat) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chat Unavailable
            </h3>
            <p className="text-gray-600">
              {user?.role === "STUDENT"
                ? "You need an active enrollment to access the course chat."
                : "Chat access is restricted."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Course Chat</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2 border rounded-lg bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.user.id === user?.id
                    ? "flex-row-reverse space-x-reverse"
                    : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={message.user.username} />
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {getInitials(message.user.firstName, message.user.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.user.id === user?.id
                      ? "bg-blue-600 text-white"
                      : "bg-white border"
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">
                    {message.user.firstName} {message.user.lastName}
                  </div>
                  <div className="text-sm">{message.text}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {formatMessageTime(message.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CourseChat;
