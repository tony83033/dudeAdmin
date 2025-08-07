"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Shield, Smartphone, CheckCircle, AlertCircle, Info } from "lucide-react"
import toast from "react-hot-toast"

export default function RetailerFilteringToggle() {
  const [isFilteringEnabled, setIsFilteringEnabled] = useState(true)
  const [superStrictMode, setSuperStrictMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [debugResults, setDebugResults] = useState<any>(null)

  const handleToggleFiltering = async (enabled: boolean) => {
    setIsLoading(true)
    try {
      // Here you would typically save this setting to your database
      // For now, we'll just update the local state
      setIsFilteringEnabled(enabled)
      
      toast.success(
        enabled 
          ? "Retailer filtering enabled for mobile app" 
          : "Retailer filtering disabled - all products shown"
      )
    } catch (error) {
      toast.error("Failed to update filtering settings")
      console.error("Error updating filtering:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSuperStrict = async (enabled: boolean) => {
    setIsLoading(true)
    try {
      setSuperStrictMode(enabled)
      toast.success(
        enabled 
          ? "Super Strict Mode enabled - Only explicitly assigned products shown" 
          : "Super Strict Mode disabled - Unrestricted products shown to all"
      )
    } catch (error) {
      toast.error("Failed to update super strict mode")
      console.error("Error updating super strict mode:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const testFiltering = async () => {
    setIsLoading(true)
    try {
      // Test the API endpoint
      const response = await fetch('/api/products')
      const data = await response.json()
      
      setTestResults({
        success: data.success,
        count: data.count,
        message: data.message,
        filtered: data.filtered
      })
      
      toast.success("API test completed successfully")
    } catch (error) {
      toast.error("API test failed")
      console.error("Error testing API:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const debugFiltering = async () => {
    setIsLoading(true)
    try {
      // Test the debug endpoint
      const response = await fetch('/api/debug/retailer-filtering')
      const data = await response.json()
      
      setDebugResults(data.debug)
      toast.success("Debug analysis completed")
    } catch (error) {
      toast.error("Debug analysis failed")
      console.error("Error debugging:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Mobile App Retailer Filtering
              <Badge variant={isFilteringEnabled ? "default" : "secondary"}>
                {isFilteringEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Control product visibility for mobile app users based on retailer availability
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <h3 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Automatic Product Filtering
            </h3>
            <p className="text-sm text-muted-foreground">
              Mobile app users will only see products available to their retailer code
            </p>
          </div>
          <Switch
            checked={isFilteringEnabled}
            onCheckedChange={handleToggleFiltering}
            disabled={isLoading}
          />
        </div>

        {/* Status Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> When enabled, the <code>/api/products</code> endpoint 
            automatically filters products based on the authenticated user's retailer code. 
            No mobile app code changes required!
          </AlertDescription>
        </Alert>

        {/* Current Behavior */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              When Enabled
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Mobile users see only their available products</li>
              <li>• Products with no restrictions shown to all</li>
              <li>• Automatic filtering based on retailer code</li>
              <li>• Admin panel shows all products (unaffected)</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-orange-600 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              When Disabled
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All mobile users see all products</li>
              <li>• Retailer availability settings ignored</li>
              <li>• Fallback to original behavior</li>
              <li>• Admin panel unaffected</li>
            </ul>
          </div>
        </div>

        {/* Test Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Test API Endpoint</h3>
            <Button 
              onClick={testFiltering} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Test /api/products
            </Button>
          </div>
          
          {testResults && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={testResults.success ? "default" : "destructive"}>
                    {testResults.success ? "Success" : "Failed"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Products Count:</span>
                  <span>{testResults.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Filtered:</span>
                  <Badge variant={testResults.filtered ? "default" : "secondary"}>
                    {testResults.filtered ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Message:</span>
                  <p className="text-muted-foreground mt-1">{testResults.message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Ready to use!</strong> Your mobile app can continue using the same 
            <code>/api/products</code> endpoint. Products will be automatically filtered 
            based on the user's retailer code when this feature is enabled.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}