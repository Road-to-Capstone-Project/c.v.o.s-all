import { CustomerDTO } from "@medusajs/framework/types";
import {
  Text,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Row,
  Section,
} from "@react-email/components";

type NewUserRegistrationEmailProps = {
  customer: CustomerDTO;
};

function NewUserRegistrationEmailComponent({
  customer,
}: NewUserRegistrationEmailProps) {
  return (
    <Html>
      <Heading>Welcome to Our Service, {customer.first_name}!</Heading>
      <Text style={{ fontSize: "16px", lineHeight: "1.5" }}>
        We're thrilled to have you on board! Your account has been successfully
        created, and you're all set to start exploring our platform.
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "1.5" }}>
        Here are your details:
      </Text>
      <Container>
        <Section
          style={{
            paddingTop: "20px",
            paddingBottom: "20px",
            borderTop: "1px solid #e0e0e0",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Row>
            <Column>
              <Text style={{ fontWeight: "bold" }}>Name:</Text>
              <Text>{customer.first_name}</Text>
            </Column>
            <Column>
              <Text style={{ fontWeight: "bold" }}>Email:</Text>
              <Text>{customer.email}</Text>
            </Column>
          </Row>
        </Section>
      </Container>
      <Text style={{ fontSize: "16px", lineHeight: "1.5" }}>
        You can now start using your account to access all the amazing features
        we offer. If you have any questions or need help, feel free to reach out
        to us anytime.
      </Text>
      <Text style={{ fontSize: "16px", lineHeight: "1.5" }}>
        Thank you for joining us. We look forward to having you as part of our
        community!
      </Text>
    </Html>
  );
}

export const newUserRegistrationEmail = (
  props: NewUserRegistrationEmailProps
) => <NewUserRegistrationEmailComponent {...props} />;
