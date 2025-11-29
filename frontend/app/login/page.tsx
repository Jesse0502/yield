"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { loginWithPassword, registerWithPassword, clearError } from "@/lib/store/slices/authSlice"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BrainCircuit, Sparkles } from "lucide-react"

// Schema for Login
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
})

// Schema for Register
const registerSchema = loginSchema
  .extend({
    name: z
      .string({ required_error: "Please tell us your name." })
      .min(2, { message: "Name must be at least 2 characters." }),
    confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, loading, error, message } = useAppSelector((state) => state.auth)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("login")

  // Redirect if already logged in
  useEffect(() => {
    setMounted(true)
    if (user) {
      router.push("/chat")
    }
  }, [user, router])

  // Clear errors when switching tabs
  useEffect(() => {
    dispatch(clearError())
  }, [activeTab, dispatch])

  // Initialize form based on active tab
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(activeTab === "login" ? loginSchema : registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  // Reset form when tab changes
  useEffect(() => {
    form.reset({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    })
  }, [activeTab, form])

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    if (activeTab === "login") {
      await dispatch(loginWithPassword({ email: values.email, password: values.password }))
    } else {
      await dispatch(
        registerWithPassword({
          email: values.email,
          password: values.password,
          name: values.name,
        })
      )
    }
  }

  // Prevent hydration mismatch
  if (!mounted) return null
  if (user) return null

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,#1e293b,transparent)]" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8 space-y-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
            <BrainCircuit className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            yield
          </h1>
          <p className="text-slate-400">
            Your intelligent second brain
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-950/50">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 text-red-200">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {message && (
                    <Alert className="bg-green-900/20 border-green-900/50 text-green-200">
                      <Sparkles className="h-4 w-4" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  
                  {activeTab === "register" && (
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ada Lovelace"
                              {...field}
                              className="bg-slate-950/50 border-slate-800 text-slate-200 focus:border-blue-500/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="name@example.com" 
                            {...field} 
                            className="bg-slate-950/50 border-slate-800 text-slate-200 focus:border-blue-500/50" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            className="bg-slate-950/50 border-slate-800 text-slate-200 focus:border-blue-500/50" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {activeTab === "register" && (
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              className="bg-slate-950/50 border-slate-800 text-slate-200 focus:border-blue-500/50" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {activeTab === "login" ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      activeTab === "login" ? "Sign In" : "Create Account"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
                <p className="text-xs text-slate-500 text-center">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
