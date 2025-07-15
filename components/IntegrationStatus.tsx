import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"

interface IntegrationStatusProps {
  name: string
  status: string
  message: string
  details?: any
}

export default function IntegrationStatus({ name, status, message, details }: IntegrationStatusProps) {
  const getIcon = (status: string) => {
    if (status === "healthy" || status === "success") {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    } else if (status === "warning" || status === "partial") {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "healthy" || status === "success") {
      return "text-green-600"
    } else if (status === "warning" || status === "partial") {
      return "text-yellow-600"
    } else {
      return "text-red-600"
    }
  }

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex-shrink-0">{getIcon(status)}</div>
      <div className="flex-grow">
        <h3 className="text-md font-semibold">{name}</h3>
        <p className={`text-sm ${getStatusColor(status)}`}>Status: {status}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        {details && (
          <details className="mt-2 text-xs text-muted-foreground">
            <summary>Details</summary>
            <pre className="mt-1 overflow-auto rounded-md bg-gray-100 p-2 dark:bg-gray-800">
              {JSON.stringify(details, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </Card>
  )
}
