import express, { Request, Response } from 'express';

export const signup = async (req: Request, res: Response) => {
	try {
		const { username, email, password } = req.body;
		
	} catch (error) {
		console.log(error);
		return res.sendStatus(400)
	}
}