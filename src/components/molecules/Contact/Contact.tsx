"use client";

import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";

const formSchema = z.object({
    name: z.string().min(2, "Der Name muss mindestens 2 Zeichen lang sein."),
    email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein."),
    message: z.string().min(10, "Die Nachricht muss mindestens 10 Zeichen enthalten."),
});

const ContactForm = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log(values);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="name"
                    render={({field}) => (
                        <>
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ihr Name" {...field} />
                                </FormControl>
                            </FormItem>
                            <FormItem>
                                <FormLabel>E-Mail</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ihre E-Mail" {...field} />
                                </FormControl>
                            </FormItem>
                            <FormItem>
                                <FormLabel>Spint</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ihre E-Mail" {...field} />
                                </FormControl>
                            </FormItem>
                            <FormItem>
                                <FormLabel>Anliegen</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ihr Anliegen" {...field} />
                                </FormControl>
                            </FormItem>
                        </>
                    )}
                />
                {/* ... weitere Felder ... */}
                <Button type="submit">Nachricht senden</Button>
            </form>
        </Form>
    );
}

export default ContactForm;