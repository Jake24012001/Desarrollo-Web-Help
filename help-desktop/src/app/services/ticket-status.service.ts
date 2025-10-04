import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketStatus } from '../../interface/TicketStatus';
import { Environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TicketStatusService {

    private http = inject(HttpClient);
    private apiUrl = `${Environment.apiUrl}/ticketstatus`;

    getAll(): Observable<TicketStatus[]> {
        return this.http.get<TicketStatus[]>(this.apiUrl);
    }

    getById(id: number): Observable<TicketStatus> {
        return this.http.get<TicketStatus>(`${this.apiUrl}/${id}`);
    }

    create(status: TicketStatus): Observable<TicketStatus> {
        return this.http.post<TicketStatus>(this.apiUrl, status);
    }

    update(id: number, status: TicketStatus): Observable<TicketStatus> {
        return this.http.put<TicketStatus>(`${this.apiUrl}/${id}`, status);
    }

    delete(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}