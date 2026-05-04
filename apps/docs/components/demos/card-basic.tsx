import { Button, Card } from '@nori-ui/core';

export default function CardBasic() {
    return (
        <Card>
            <Card.Header>
                <Card.Title>Project access</Card.Title>
                <Card.Description>Manage who can view and edit this project.</Card.Description>
            </Card.Header>
            <Card.Content>
                Two collaborators currently have access. Add new ones by sending an invite link or assigning a workspace
                role.
            </Card.Content>
            <Card.Footer>
                <Button variant="ghost">Cancel</Button>
                <Button>Invite</Button>
            </Card.Footer>
        </Card>
    );
}
