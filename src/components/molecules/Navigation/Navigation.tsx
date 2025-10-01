"use client"

import * as React from "react"
import Link from "next/link"
import {House, CircleHelpIcon, CircleIcon} from "lucide-react"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const Navigation = () => {
    return (
        <NavigationMenu>
            <NavigationMenuList className="gap-4">
                <NavigationMenuItem>
                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/" className="p-4">
                            <House color='black' className="h-8 w-8"/>
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-xl">Safe</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-5 p-5 text-xl">
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/safe/booking">Safe buchen</Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link href="/support/contactForm">Fehler melden</Link>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-xl">Hilfe</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-5 p-5 text-xl">
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/support/faq" className="flex-row items-center gap-3">
                                        <CircleHelpIcon className="h-8 w-8"/>
                                        FAQ
                                    </Link>
                                </NavigationMenuLink>
                                <NavigationMenuLink asChild>
                                    <Link href="/support/contactForm" className="flex-row items-center gap-3">
                                        <CircleIcon className="h-8 w-8"/>
                                        Kontaktformular
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink className='p-0' asChild>
                        <Link href="/profile">
                            <img className='h-16 p-2 rounded-full' src='https://api.samplefaces.com/face?width=200'
                                 alt='Random Profile'/>
                        </Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}

export default Navigation;