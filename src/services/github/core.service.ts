import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { ApiError } from '../../utils';
import parentLogger from '../../config/logger';
import httpStatus from 'http-status';

const logger = parentLogger.child({ module: 'GithubCoreService' });

/**
 * generate an access token for github app
 */
async function generateAppAccessToken() {
    try {
        const payload = {
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 600,
            iss: config.oAuth2.github.clientId
        }
        const filePath: string = path.join(__dirname, '../../../githubapp.private-key.pem');
        const privateKey = fs.readFileSync(filePath, 'utf8');
        var token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
        return token;
    } catch (error) {
        logger.error({ error }, 'Failed to create access token for github app');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to create access token for github app');
    }
}

/**
 * get installation access token 
 * @param {string} appAccessToken
   @param {string} installationId
 */
async function getInstallationAccessToken(appAccessToken: string, installationId: string) {
    try {
        const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
            method: 'POST',
            headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', "Authorization": `Bearer ${appAccessToken}` },
        });
        if (response.ok) {
            return await response.json();
        } else {
            const errorResponse = await response.text();
            logger.error({ error: errorResponse }, 'Failed to get installation access token');
            throw new Error(`Failed to get installation access token: ${errorResponse}`);
        }
    } catch (error) {
        logger.error({ installationId, error }, 'Failed to get installation access token');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get installation access token');
    }
}

/**
 * get installation repos
 * @param {string} installationAccessToken
   @param {string} installationId
 */
async function getInstallationRepos(installationAccessToken: string, installationId: string) {
    try {
        const response = await fetch(`https://api.github.com/installation/repositories`, {
            method: 'GET',
            headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', "Authorization": `Bearer ${installationAccessToken}` },
        });
        if (response.ok) {
            return await response.json();
        } else {
            const errorResponse = await response.text();
            logger.error({ error: errorResponse }, 'Failed to get installation repos');
            throw new Error(`Failed to get installation repos: ${errorResponse}`);
        }
    } catch (error) {
        logger.error({ installationId, error }, 'Failed to get installation repos');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get installation repos');
    }
}

/**
 * get installation details
 * @param {string} appAccessToken
   @param {string} installationId
 */
async function getInstallationDetails(appAccessToken: string, installationId: string) {
    try {
        const response = await fetch(`https://api.github.com/app/installations/${installationId}`, {
            method: 'GET',
            headers: { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', "Authorization": `Bearer ${appAccessToken}` },
        });
        if (response.ok) {
            return await response.json();
        } else {
            const errorResponse = await response.text();
            logger.error({ error: errorResponse }, 'Failed to get installation details');
            throw new Error(`Failed to get installation details: ${errorResponse}`);
        }
    } catch (error) {
        logger.error({ installationId, error }, 'Failed to get installation details');
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get installation details');
    }
}




export default {
    generateAppAccessToken,
    getInstallationAccessToken,
    getInstallationRepos,
    getInstallationDetails
};
