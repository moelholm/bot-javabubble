import { SSMClient, GetParametersByPathCommand } from "@aws-sdk/client-ssm";

export async function getParameters() {
  if (!process.env.SSM_PATH) {
    return {};
  }

  const ssmClient = new SSMClient({});

  const parametersResponse = await ssmClient.send(
    new GetParametersByPathCommand({
      Path: process.env.SSM_PATH,
      WithDecryption: true,
    })
  );

  const parameters = (parametersResponse.Parameters || []).map(
    ({ Name, Value }) => ({ [`${Name?.replace(/.*\//, "")}`]: Value })
  );

  return Object.assign({}, ...parameters);
}