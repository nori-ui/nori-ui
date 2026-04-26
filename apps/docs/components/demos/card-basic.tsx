import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@nori-ui/core';

export default function CardBasic() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Project access</CardTitle>
                <CardDescription>Manage who can view and edit this project.</CardDescription>
            </CardHeader>
            <CardContent>
                Two collaborators currently have access. Add new ones by sending an invite link or assigning a workspace
                role.
            </CardContent>
            <CardFooter>
                <Button variant="ghost">Cancel</Button>
                <Button>Invite</Button>
            </CardFooter>
        </Card>
    );
}
