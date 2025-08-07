"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, Users, Hash } from "lucide-react"

interface RetailerAvailabilityInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function RetailerAvailabilityInput({
  value = [],
  onChange,
  placeholder = "Enter retailer codes",
  disabled = false
}: RetailerAvailabilityInputProps) {
  const [singleCode, setSingleCode] = useState("")
  const [bulkCodes, setBulkCodes] = useState("")
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")

  const addSingleCode = () => {
    const code = singleCode.trim()
    if (code && !value.includes(code)) {
      onChange([...value, code])
      setSingleCode("")
    }
  }

  const addBulkCodes = () => {
    const codes = bulkCodes
      .split(/[,\n\s]+/)
      .map(code => code.trim())
      .filter(code => code && !value.includes(code))
    
    if (codes.length > 0) {
      onChange([...value, ...codes])
      setBulkCodes("")
    }
  }

  const addRangeCodes = () => {
    const start = parseInt(rangeStart)
    const end = parseInt(rangeEnd)
    
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      const rangeCodes = []
      for (let i = start; i <= end; i++) {
        const code = i.toString()
        if (!value.includes(code)) {
          rangeCodes.push(code)
        }
      }
      
      if (rangeCodes.length > 0) {
        onChange([...value, ...rangeCodes])
        setRangeStart("")
        setRangeEnd("")
      }
    }
  }

  const removeCode = (codeToRemove: string) => {
    onChange(value.filter(code => code !== codeToRemove))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Retailer Availability
        </CardTitle>
        <CardDescription>
          Specify which retailers can access this product. Leave empty for all retailers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Selection Display */}
        {value.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selected Retailers ({value.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={disabled}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md bg-gray-50">
              {value.map((code) => (
                <Badge key={code} variant="secondary" className="flex items-center gap-1">
                  {code}
                  {!disabled && (
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => removeCode(code)}
                    />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Input Methods */}
        {!disabled && (
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Single</TabsTrigger>
              <TabsTrigger value="bulk">Bulk</TabsTrigger>
              <TabsTrigger value="range">Range</TabsTrigger>
            </TabsList>

            {/* Single Code Input */}
            <TabsContent value="single" className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter retailer code (e.g., R001)"
                  value={singleCode}
                  onChange={(e) => setSingleCode(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSingleCode()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addSingleCode}
                  disabled={!singleCode.trim()}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Bulk Codes Input */}
            <TabsContent value="bulk" className="space-y-3">
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter multiple codes separated by commas, spaces, or new lines&#10;Example: R001, R002, R003&#10;or&#10;R001&#10;R002&#10;R003"
                  value={bulkCodes}
                  onChange={(e) => setBulkCodes(e.target.value)}
                  rows={4}
                />
                <Button
                  type="button"
                  onClick={addBulkCodes}
                  disabled={!bulkCodes.trim()}
                  size="sm"
                  className="w-full"
                >
                  Add Bulk Codes
                </Button>
              </div>
            </TabsContent>

            {/* Range Input */}
            <TabsContent value="range" className="space-y-3">
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Label htmlFor="range-start" className="text-sm">From</Label>
                    <Input
                      id="range-start"
                      type="number"
                      placeholder="1"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="pt-6">
                    <Hash className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="range-end" className="text-sm">To</Label>
                    <Input
                      id="range-end"
                      type="number"
                      placeholder="100"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addRangeCodes}
                  disabled={!rangeStart || !rangeEnd || parseInt(rangeStart) > parseInt(rangeEnd)}
                  size="sm"
                  className="w-full"
                >
                  Add Range ({rangeStart && rangeEnd && parseInt(rangeStart) <= parseInt(rangeEnd) 
                    ? `${parseInt(rangeEnd) - parseInt(rangeStart) + 1} codes` 
                    : '0 codes'})
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
          <strong>Note:</strong> If no retailer codes are specified, the product will be available to all retailers. 
          Use retailer codes to restrict product availability to specific shops only.
        </div>
      </CardContent>
    </Card>
  )
}