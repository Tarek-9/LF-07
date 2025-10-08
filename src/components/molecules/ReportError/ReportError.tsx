"use client";

import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useRouter} from "next/navigation";
import {toast} from "react-hot-toast";
import {Button} from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import ChoosePlace from "@/components/atoms/ChoosePlace/ChoosePlace";

const formSchema = z.object({
    email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein."),
    place: z.number().min(1, "Du musst ein Platzauswählen."),
    message: z.string().min(10, "Die Nachricht muss mindestens 10 Zeichen enthalten."),
});

const ReportError = () => {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            place: 0,
            message: "",
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log(values);
        toast.success("Ihre Nachricht wurde erfolgreich gesendet!");
        router.push("/");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>E-Mail</FormLabel>
                            <FormControl>
                                <Input placeholder="Ihre E-Mail-Adresse" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="place"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Platzname</FormLabel>
                            <FormControl>
                                <ChoosePlace {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Problembeschreibung</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Das Problem einmal beschreiben" {...field} />
                            </FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <Button type="submit">Nachricht senden</Button>
            </form>
        </Form>
    );
};

export default ReportError;
